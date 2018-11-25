# Copyright 2017 The Bazel Authors. All rights reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"Install babel_library toolchain dependencies"

load("@build_bazel_rules_nodejs//:defs.bzl", "check_bazel_version", "check_rules_nodejs_version", "npm_install")

def babel_library_setup_workspace():
    """This macro should be called from your WORKSPACE file.

    It installs dependencies needed by this package.
    """

    # 0.17.1: allow @ in package names is required for fine grained deps
    check_bazel_version("0.17.1")

    # 0.15.0: fine grained npm dependencies breaking change
    check_rules_nodejs_version("0.15.0")

    npm_install(
        name = "babel_library_deps",
        package_json = "//internal/babel-library:package.json",
        package_lock_json = "//internal/babel-library:package-lock.json"
    )
