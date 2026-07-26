"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const client_1 = require("react-dom/client");
const App_jsx_1 = __importDefault(require("./App.jsx"));
console.log('HELLO FROM MAIN.JSX');
const react_2 = __importDefault(require("react"));
class ErrorBoundary extends react_2.default.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        this.setState({ error, info });
    }
    render() {
        if (this.state.hasError) {
            return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 40, fontFamily: 'monospace', color: 'red' }, children: [(0, jsx_runtime_1.jsx)("h2", { children: "Something went wrong." }), (0, jsx_runtime_1.jsxs)("details", { style: { whiteSpace: 'pre-wrap' }, children: [this.state.error && this.state.error.toString(), (0, jsx_runtime_1.jsx)("br", {}), this.state.info && this.state.info.componentStack] })] }));
        }
        return this.props.children;
    }
}
(0, client_1.createRoot)(document.getElementById('root')).render((0, jsx_runtime_1.jsx)(react_1.StrictMode, { children: (0, jsx_runtime_1.jsx)(ErrorBoundary, { children: (0, jsx_runtime_1.jsx)(App_jsx_1.default, {}) }) }));
