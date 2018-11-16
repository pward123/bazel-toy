"""Public API surface is re-exported here.
"""

# Name of the bazel npm repo where our dependencies are stored
rsync_dir_npm_name = "rsync_dir_npm"

# Name of the workspace path where we reside
rsync_dir_ws_path = "//internal/rsync-dir"

# Names of the npm package files
rsync_dir_package_json = rsync_dir_ws_path + ":package.json"
rsync_dir_package_lock_json = rsync_dir_ws_path + ":package-lock.json"

# data property to be used in npm_install rules
rsync_dir_npm_install_data = [
    rsync_dir_ws_path + ":rsync-dir.js",
    rsync_dir_package_json,
    rsync_dir_package_lock_json,
]

# entry_point and data properties to be used in node_binary rules
rsync_dir_nodejs_binary_entry_point = "my_workspace/internal/rsync-dir/rsync-dir.js"
rsync_dir_nodejs_binary_data = rsync_dir_npm_install_data + [
    "@" + rsync_dir_npm_name + "//fs-extra",
    "@" + rsync_dir_npm_name + "//commander",
]
