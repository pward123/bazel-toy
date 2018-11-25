"""Public API surface is re-exported here.
"""

load("//internal/babel-library:babel-library.bzl", _babel_library = "babel_library")
babel_library = _babel_library

babel_library_deps = [
    "//internal/babel-library:package.json",
    "//internal/babel-library:babel.js",
    # "//internal/babel-library:package-lock.json",
]
