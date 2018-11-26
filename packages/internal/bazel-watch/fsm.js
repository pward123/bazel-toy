/**
 * A light-weight version of machina.js
 **/
'use strict'

const assert = require('assert')
const EventEmitter = require('events')
const log = require('./log')

const _config = new WeakMap()
const _inputQueue = new WeakMap()
const _inputs = new WeakMap()
const _pumping = new WeakMap()
const _state = new WeakMap()
const _states = new WeakMap()
const _transitionCount = new WeakMap()
const _logPrefix = new WeakMap()

class FSM extends EventEmitter {
    constructor({states, initialState, inputs, config, logPrefix = 'FSM'}) {
        super()
        _logPrefix.set(this, logPrefix)
        _config.set(this, config)
        _inputQueue.set(this, [])
        _inputs.set(this, inputs)
        _pumping.set(this, false)
        _state.set(this, initialState)
        _states.set(this, states)
        _transitionCount.set(this, 0)
    }

    get logPrefix() {
        return _logPrefix.get(this)
    }

    get state() {
        return _state.get(this)
    }

    enqueue(input) {
        const inputs = _inputs.get(this)
        if (!inputs[input]) {
            throw new Error(`Invalid input(${input})`)
        }

       // this.emit('log', `[FSM] Received input(${input})`)
       _inputQueue.get(this).push(input)
       pump.call(this)
    }

    /**
     * Protected getter to retrieve the _transitionCount
     */
    get transitionCount() {
        return _transitionCount.get(this)
    }

    /**
     * Protected method to transition to a new state
     */
    transition(newState) {
        let state = _state.get(this)
        if (state === newState) {
            return
        }

        const states = _states.get(this)
        const config = _config.get(this)
        const logPrefix = _logPrefix.get(this)

        if (!states[newState]) {
            throw new Error(`Invalid state(${newState})`)
        }

        // Fire the previous state's onExit handler if it exists
        const onExit = config[state].onExit
        if (onExit) {
            try {
                onExit()
            } catch (e) {
                log.error(`${logPrefix}Error in ${state}.onExit handler`, e.stack)
            }
        }

        // Transition
        log.debug(`${logPrefix}transitioning from ${state} to ${newState}`)
        state = newState
        _state.set(this, state)

        let transitionCount = _transitionCount.get(this)
        if (transitionCount++ >= 1e8) {
            this._transitionCount = 0
        }
        _transitionCount.set(this, transitionCount)

        // Fire the new state's onExit handler if it exists
        assert(config[state], `config[${state}] must exist`)
        const onEnter = config[state].onEnter
        if (onEnter) {
            try {
                onEnter()
            } catch (e) {
                log.error(`${logPrefix}Error in ${state}.onEnter handler`, e.stack)
            }
        }

        // Pump messages
        pump.call(this)
    }
}

function pump() {
    if (!_pumping.get(this)) {
        _pumping.set(this, true)
        try {
            const inputQueue = _inputQueue.get(this)
            const logPrefix = _logPrefix.get(this)

            while (inputQueue.length > 0) {
                const input = inputQueue.shift()
                const state = this.state
                const handler = _config.get(this)[state][input]
                if (!handler) {
                    throw new Error(`Input(${input}) is not valid when in state(${state})`)
                }
                try {
                    handler()
                } catch (e) {
                    log.error(`${logPrefix}Error in states[${state}][${input}] handler`, e.stack)
                }
            }
        } finally {
            _pumping.set(this, false)
        }
    }
}

module.exports = FSM
