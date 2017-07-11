import commonjs from "rollup-plugin-commonjs";
import nodeResolve from "rollup-plugin-node-resolve";
import flow from "rollup-plugin-flow";

export default {
    entry: "src/Container.js",
    targets: [
        { dest: "dist/bundle.cjs.js", format: "cjs" },
        { dest: "dist/bundle.es.js", format: "es" },
        {
            dest: "dist/bundle.umd.js",

            format: "umd",
            moduleName: "ContainerQuery"
        }
    ],
    plugins: [flow(), commonjs(), nodeResolve()]
};