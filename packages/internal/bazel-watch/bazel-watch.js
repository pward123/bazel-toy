'use strict'

const ChildProcess = require('./child-process')
const log = require('./log')
const Path = require('path')
const pkg = require('./package.json')
const program = require('commander')
const sane = require('sane')

const addToArray = (val, memo) => {
    if (!memo) {
        memo = []
    }
    memo.push(val)
    return memo
}

const main = async () => {
    let op = 'parsing arguments'
    try {
        program
            .version(pkg.version)
            .usage('[options] <bazelCommand> <bazelArgs>')
            .option('-i, --include <glob>', 'include a glob to watch', addToArray)
            .option('-e, --exclude <glob>', 'exclude a glob from watch', addToArray)
            .option('-r, --relative-env <env_var>', 'include/exclude are relative to this env var [BUILD_WORKSPACE_DIRECTORY]')
            .option('-R, --relative <dir>', 'include/exclude are relative to this path')
            .option('-p, --poll', 'use polling mode')
            .option('-n, --node-watch', 'use native node file watching')
            .option('-w, --watchexec', 'use \'watchexec\' for file watching')
            .option('-d, --dot', 'watch dot files')
            .option('-W, --watchman-path', 'specify path to watchman')
            .parse(process.argv)

        let {relative: relativeDir} = program

        const {
            include: glob,
            exclude: ignored,
            poll,
            nodeWatch,
            watchexec,
            dot,
            watchmanPath,
        } = program

        if (!relativeDir) {
            relativeDir = process.env[program.relativeEnv || 'BUILD_WORKSPACE_DIRECTORY']
        }

        const saneOptions = {
            glob,
            ignored,
            dot,
        }

        if (poll) {
            saneOptions.poll = true
        } else if (watchexec) {
            saneOptions.watchexec = true
        } else if (!nodeWatch) {
            saneOptions.watchman = true
            saneOptions.watchmanPath = watchmanPath
        }

        const args = [...program.args]
        const command = args.shift()

        const childProcess = new ChildProcess({
            command,
            args,
            cwd: relativeDir,
        })

        const watcher = sane(relativeDir, saneOptions)
        watcher.on('ready', () => {
            childProcess.activate()
        })
        watcher.on('change', (filepath, root, stat) => {
            childProcess.restart()
        })
        watcher.on('add', (filepath, root, stat) => {
            childProcess.restart()
        })
        watcher.on('delete', (filepath, root) => {
            childProcess.restart()
        })

    } catch (e) {
        console.error('Problem', op, e.stack)
    }
}

main()
    .then(() => {
        console.log('watch started')
        // process.exit(0)
    })
    .catch(e => {
        process.exit(-1)
    })
