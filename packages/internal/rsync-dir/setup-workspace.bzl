"Install rsync-dir toolchain dependencies"

load("@build_bazel_rules_nodejs//:defs.bzl", "check_bazel_version", "check_rules_nodejs_version", "npm_install")
load(":defs.bzl", "rsync_dir_npm_name", "rsync_dir_package_json", "rsync_dir_package_lock_json")

def rsync_dir_setup_workspace():
    """This macro should be called from your WORKSPACE file.

    It installs dependencies needed by this package.
    """

    # 0.17.1: allow @ in package names is required for fine grained deps
    check_bazel_version("0.17.1")

    # 0.15.0: fine grained npm dependencies breaking change
    check_rules_nodejs_version("0.15.0")

    npm_install(
        name = rsync_dir_npm_name,
        package_json = rsync_dir_package_json,
        package_lock_json = rsync_dir_package_lock_json,
    )
