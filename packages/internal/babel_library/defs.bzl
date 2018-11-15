"""Public API surface is re-exported here.
"""

load("//internal/babel_library:babel_library.bzl", _babel_library = "babel_library")
babel_library = _babel_library

babel_library_deps_files = [
    "//internal/babel_library:package.json",
    "//internal/babel_library:babel.js",
    # "//internal/babel_library:package-lock.json",
]
