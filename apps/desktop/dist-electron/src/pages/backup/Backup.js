"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Backup;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
function Backup() { return ((0, jsx_runtime_1.jsxs)("div", { className: "card", children: [(0, jsx_runtime_1.jsx)("div", { className: "card-header", children: (0, jsx_runtime_1.jsx)("h2", { className: "card-title", children: "Local Backup" }) }), (0, jsx_runtime_1.jsx)("div", { className: "card-body", children: (0, jsx_runtime_1.jsxs)("button", { className: "btn btn-primary", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Database, { size: 16 }), " Trigger Local Backup"] }) })] })); }
