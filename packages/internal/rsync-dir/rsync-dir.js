'use strict'

const assert = require('assert')
const fs = require('fs')
const fsextra = require('fs-extra')
const pkg = require('./package.json')
const Path = require('path')
const program = require("commander");
const {promisify} = require('util')
const childProcess = require('child_process')

const exists = promisify(fs.exists)
const stat = promisify(fs.stat)
const spawn = promisify(childProcess.spawn)

const isDirectory = async (path) => {
    assert(path, 'path is required')

    try {
        const stats = await stat(path)
        return stats.isDirectory()
    } catch (e) {
        if (e.code === 'ENOENT') {
            return false
        }
        throw e
    }
}

const main = async () => {
    let op = 'parsing arguments'
    try {
        program
            .version(pkg.version)
            .usage('[options] <sourcePath> <destPath>')
            .option('-s, --source-relative <env_var>', 'sourcePath is relative to this env var [PWD]')
            .option('-d, --dest-relative <env_var>', 'destPath is relative to this env var [BUILD_WORKSPACE_DIRECTORY]')
            .option('-n, --no-delete', 'Retain files in destPath that don\'t exist in sourcePath')
            .option('-r, --rsync-path', 'Path to rsync [/usr/bin/rsync]')
            .parse(process.argv);

        const {
            sourceRelative: sourceEnv = 'PWD',
            destRelative: destEnv = 'BUILD_WORKSPACE_DIRECTORY',
            rsyncPath: rsyncPath = '/usr/bin/rsync',
        } = program

        op = 'checking base source path'
        const sourceBasePath = (sourceEnv && process.env[sourceEnv]) || process.env.PWD
        assert(isDirectory(sourceBasePath), `sourceBasePath(${sourceBasePath}) must exist as a directory`)

        op = 'checking source path'
        const sourcePath = Path.join(sourceBasePath, program.args[0])
        assert(isDirectory(sourcePath), `sourcePath(${sourcePath}) must exist as a directory`)

        op = 'checking dest path'
        const destBasePath = (destEnv && process.env[destEnv]) || process.env.BUILD_WORKSPACE_DIRECTORY
        const destPath = Path.join(destBasePath, program.args[1])

        op = 'creating dest path'
        await fsextra.ensureDir(destPath)

        op = 'checking rsync args'
        const args = ['-aL', `${sourcePath}/`, `${destPath}/`]
        if (!program.noDelete) {
            args.push('--delete')
        }

        op = 'checking existence of rsync'
        assert(rsyncPath, 'rsyncPath must be specified')
        assert(await exists(rsyncPath), `rsyncPath(${rsyncPath}) must exist`)

        op = 'executing rsync'
        await spawn(rsyncPath, args, {})
    } catch (e) {
        console.error('Problem', op, e.stack)
    }
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch(e => {
        process.exit(-1)
    })
