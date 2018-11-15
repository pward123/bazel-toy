"Install babel toolchain dependencies"

load("@build_bazel_rules_nodejs//:defs.bzl", "check_bazel_version", "check_rules_nodejs_version", "npm_install")
load("//internal/babel_library:defs.bzl", "babel_library_deps_files")

def my_es6_lib_setup_workspace():
    """This macro should be called from your WORKSPACE file.

    It installs dependencies needed by this package.
    """

    # 0.17.1: allow @ in package names is required for fine grained deps
    check_bazel_version("0.17.1")

    # 0.15.0: fine grained npm dependencies breaking change
    check_rules_nodejs_version("0.15.0")

    npm_install(
        name = "my_es6_lib_deps",
        package_json = "//my-es6-lib:package.json",
        package_lock_json = "//my-es6-lib:package-lock.json",
        data = babel_library_deps_files,
    )
