"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/children.ts
var children_exports = {};
__export(children_exports, {
  getValidChildren: () => getValidChildren,
  pickChildren: () => pickChildren
});
module.exports = __toCommonJS(children_exports);
var import_react = require("react");
function getValidChildren(children) {
  return import_react.Children.toArray(children).filter(
    (child) => (0, import_react.isValidElement)(child)
  );
}
var pickChildren = (children, targetChild) => {
  var _a;
  let target = [];
  const withoutTargetChildren = (_a = import_react.Children.map(children, (item) => {
    if (!(0, import_react.isValidElement)(item))
      return item;
    if (item.type === targetChild) {
      target.push(item);
      return null;
    }
    return item;
  })) == null ? void 0 : _a.filter(Boolean);
  const targetChildren = target.length >= 0 ? target : void 0;
  return [withoutTargetChildren, targetChildren];
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getValidChildren,
  pickChildren
});
