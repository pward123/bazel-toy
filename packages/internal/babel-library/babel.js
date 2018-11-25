// A simple wrapper around babel-core due to https://github.com/babel/babel/issues/8193

const babel = require("@babel/core");
const fs = require("fs");
const path = require("path");
const pkg = require('./package.json')
const program = require("commander");
const { promisify } = require("util");

const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
const writeFile = promisify(fs.writeFile);
const transformFile = promisify(babel.transformFile.bind(babel));

const mkdirp = async p => {
  if (!(await exists(p))) {
    await mkdirp(path.dirname(p));
    await mkdir(p);
  }
};

program
  .version(pkg.version)
  .usage("[options] <files...>")
  .option("-o, --out-dir <value>", "Output directory for created files")
  .option("-c, --config-file <value>", "babel.rc.js config file")
  .parse(process.argv);

const outDir = program["outDir"] || "";

let babelConfig = {};
if (program["configFile"]) {
  // Note: We do not want to use bazel resolve mechanisms, so use path resolve to get the absolute
  // path and load that.
  babelConfig = require(path.resolve(program["configFile"]));
}

const promises = [];
for (let i = 0; i < program.args.length; i += 2) {
  const input = program.args[i];
  const output = path.join(outDir, program.args[i + 1]);

  promises.push(
    (async () => {
      let op
      try {
        op = `transforming file ${input}`;
        const result = await transformFile(input, babelConfig);

        const outputDir = path.dirname(output);
        op = `creating folder ${outputDir}`;
        await mkdirp(outputDir);

        op = `writing file ${output}`;
        await writeFile(output, result.code);
      } catch (e) {
        console.error("Problem", op, e.stack);
      }
    })()
  );
}

Promise.all(promises)
  .then(() => process.exit(0))
  .catch(() => process.exit(-1));
