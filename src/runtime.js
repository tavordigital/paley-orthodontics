// Small runtime that renders the page templates (from src/pages/*.dc.html) with Preact.
// Template syntax: {{ path }} holes, <sc-if value="{{ x }}">, <sc-for list="{{ xs }}" as="x">.
import { h, render, Component } from './preact.module.js';

export class DCLogic extends Component {
  render() {
    return this.__tpl(typeof this.renderVals === 'function' ? this.renderVals() : {});
  }
}

const WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;
const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

function lookup(path, scopes) {
  path = path.trim();
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (path === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
  const parts = path.split('.');
  let v;
  let found = false;
  for (let i = scopes.length - 1; i >= 0; i--) {
    const s = scopes[i];
    if (s && Object.prototype.hasOwnProperty.call(s, parts[0])) { v = s[parts[0]]; found = true; break; }
  }
  if (!found) return undefined;
  for (let i = 1; i < parts.length; i++) {
    if (v == null) return undefined;
    v = v[parts[i]];
  }
  return v;
}

function interp(str, scopes) {
  const m = str.match(WHOLE);
  if (m) return lookup(m[1], scopes);
  return str.replace(HOLE, (_, p) => {
    const v = lookup(p, scopes);
    return v == null ? '' : String(v);
  });
}

function kids(node, scopes) {
  const out = [];
  (node.c || []).forEach((c) => {
    const r = build(c, scopes);
    if (Array.isArray(r)) out.push(...r); else if (r != null) out.push(r);
  });
  return out;
}

function build(node, scopes) {
  if (node.t === 'text') {
    if (node.d.indexOf('{{') < 0) return node.d;
    const v = interp(node.d, scopes);
    return v == null ? '' : String(v);
  }
  if (node.n === 'sc-if') {
    return interp(node.a.value || '', scopes) ? kids(node, scopes) : null;
  }
  if (node.n === 'sc-for') {
    const list = interp(node.a.list || '', scopes) || [];
    const as = node.a.as || 'item';
    const out = [];
    list.forEach((item, i) => { out.push(...kids(node, scopes.concat([{ [as]: item, $index: i }]))); });
    return out;
  }
  const props = {};
  for (const k in node.a) {
    if (k.indexOf('hint-') === 0) continue;
    let v = node.a[k];
    if (typeof v === 'string' && v.indexOf('{{') >= 0) v = interp(v, scopes);
    let key = k;
    // Range sliders need live updates while dragging.
    if (k === 'onChange' && node.n === 'input') key = 'onInput';
    props[key] = v;
  }
  return h(node.n, props, ...kids(node, scopes));
}

export function mount(tree, Comp) {
  Comp.prototype.__tpl = function (vals) {
    const nodes = kids({ c: tree }, [vals]);
    return nodes.length === 1 ? nodes[0] : h('div', null, ...nodes);
  };
  render(h(Comp, {}), document.getElementById('app'));
}
