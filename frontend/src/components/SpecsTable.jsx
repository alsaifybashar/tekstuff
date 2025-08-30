// src/components/SpecsTable.jsx
import React from 'react';

export default function SpecsTable({ specs }) {
  if (!specs) return null;

  // supports object {key:value} or array of {label, value}
  const rows = Array.isArray(specs)
    ? specs.map((s, i) => ({ key: s.label ?? `Spec ${i+1}`, val: s.value ?? s.val ?? '' }))
    : Object.keys(specs).map(k => ({ key: k, val: specs[k] }));

  if (!rows.length) return null;

  return (
    <table className="table table-sm">
      <tbody>
        {rows.map(({ key, val }) => (
          <tr key={String(key)}>
            <th style={{ width: '30%' }}>{key}</th>
            <td>{String(val)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
