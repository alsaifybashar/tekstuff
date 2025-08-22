// src/components/HamburgerMenu.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';

const CustomToggle = React.forwardRef((props, ref) => {
  const { children, onClick } = props;
  const expanded = props['aria-expanded']; // provided by react-bootstrap

  return (
    <button
      ref={ref}
      type="button"
      className={`btn btn-outline-dark d-flex align-items-center gap-2 x-burger-toggle ${expanded ? 'is-open' : ''}`}
      onClick={(e) => { e.preventDefault(); onClick?.(e); }}
      aria-label="Open categories menu"
      aria-expanded={expanded}
    >
      <span className="x-burger" aria-hidden="true">
        <span className="x-burger-bar top" />
        <span className="x-burger-bar middle" />
        <span className="x-burger-bar bottom" />
      </span>
      <span className="d-none d-sm-inline">{children}</span>
    </button>
  );
});
CustomToggle.displayName = 'CustomToggle';

export default function HamburgerMenu() {
  return (
    <Dropdown align="start">
      <Dropdown.Toggle as={CustomToggle} id="hamburger-categories">
        Meny
      </Dropdown.Toggle>

      <Dropdown.Menu className="shadow" style={{ minWidth: 280 }}>
        <Dropdown.Header>Electronics</Dropdown.Header>
        <Dropdown.Item as={NavLink} to="/c/chargers">Chargers</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/laptops">Laptops</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/accessories">Accessories</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Header>Home & Garden</Dropdown.Header>
        <Dropdown.Item as={NavLink} to="/c/kitchen">Kitchen</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/furniture">Furniture</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/outdoor">Outdoor</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Header>Fashion</Dropdown.Header>
        <Dropdown.Item as={NavLink} to="/c/men">Men</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/women">Women</Dropdown.Item>
        <Dropdown.Item as={NavLink} to="/c/kids">Kids</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item as={NavLink} to="/deals" className="fw-semibold">🔥 Today’s Deals</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
