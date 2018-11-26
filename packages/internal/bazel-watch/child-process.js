'use strict'

const FSM = require('./fsm')
const killPID = require('./kill-pid-tree')
const log = require('./log')
const {spawn} = require('child_process')

const toObject = (accum, x) => {
    accum[x] = x
    return accum
}

const states = [
    'inactive',       // our initial state
    'active',
    'waitToRestart',  // Wait a bit and then spawn the child
    'error',
].reduce(toObject, {})

const inputs = [
    'activate',
    'deactivate',
    'restart',
].reduce(toObject, {})

const _childProcess = new WeakMap()
const _restartWait = new WeakMap()

class ChildProcess extends FSM {
    constructor({
        command,
        args = [],
        stdio = 'inherit',
        env = process.env,
        cwd = process.cwd(),
        restartWait = 0,
    }) {
        super({
            logPrefix: '[ChildProcess-FSM] ',
            states,
            initialState: states.inactive,
            inputs,
            config: {
                [states.inactive]: {
                    [inputs.activate]: () => {
                        this.transition(states.active)
                    },

                    [inputs.restart]: () => {
                        this.transition(states.active)
                    },

                    [inputs.deactivate]: () => {
                        // noop
                    },
                },

                [states.active]: {
                    onEnter: () => {
                        const transitionCount = this.transitionCount

                        if (_childProcess.get(this)) {
                            throw new Error('childProcess must not exist')
                        }

                        log.debug(`${this.logPrefix}Spawning child process`)
                        _childProcess.set(this, spawn(
                            command,
                            args,
                            {
                                cwd,
                                detached: true,
                                stdio,
                                env
                            },
                            (e) => {
                                if (this.transitionCount !== transitionCount) {
                                    log.debug(`${this.logPrefix}Ignoring child process exit due to transition`)
                                    return
                                }

                                if (e) {
                                    log.error(`${this.logPrefix}Child process exited with error`, e.stack)
                                } else {
                                    log.debug(`${this.logPrefix}Child process exited normally`)
                                }

                                _childProcess.delete(this)

                                // If the child exited and we've never left this state
                                // it's cause the child terminated on its own. Wait a
                                // few and respawn it.
                                this.transition(states.waitToRestart)
                            }
                        ))
                    },

                    [inputs.activate]: () => {
                        // noop
                    },

                    [inputs.restart]: () => {
                        this.transition(states.waitToRestart)
                    },

                    [inputs.deactivate]: () => {
                        this.transition(states.inactive)
                    },

                    onExit: () => {
                        const childProcess = _childProcess.get(this)

                        // If child doesn't exist, its cause we're transitioning to
                        // waitToRestart
                        if (childProcess) {
                            const {pid} = childProcess
                            _childProcess.delete(this)

                            log.debug(`${this.logPrefix}Killing child process(${pid})`)
                            try {
                                killPID(pid, 'SIGKILL')
                            } catch (e) {
                                log.error(`${this.logPrefix}Problem killing child process:`, e.stack)
                                throw e
                            }

                        }
                    },
                },

                [states.waitToRestart]: {
                    onEnter: () => {
                        const transitionCount = this.transitionCount
                        const restartWait = _restartWait.get(this)

                        log.debug(`${this.logPrefix}Waiting ${restartWait} seconds before respawning child process`)
                        setTimeout(() => {
                            if (this.transitionCount !== transitionCount) {
                                log.debug(`${this.logPrefix}Aborting child process respawn due to transition`)
                                return
                            }

                            this.transition(states.active)
                        }, restartWait * 1000)
                    },

                    [inputs.activate]: () => {
                        // noop
                    },

                    [inputs.restart]: () => {
                        // noop
                    },

                    [inputs.deactivate]: () => {
                        this.transition(states.inactive)
                    },
                },

                [states.error]: {
                    onEnter: () => {
                        log.error(`${this.logPrefix}Child process fsm error detected.`)
                    },
                },
            }
        })
        _restartWait.set(this, restartWait)
    }

    activate() {
        this.enqueue(inputs.activate)
    }

    deactivate() {
        this.enqueue(inputs.deactivate)
    }

    restart() {
        this.enqueue(inputs.restart)
    }
}

module.exports = ChildProcess
