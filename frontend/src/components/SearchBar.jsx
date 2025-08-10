
import { useState } from 'react';
import { InputGroup, FormControl, Button } from 'react-bootstrap';

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };

  return (
    <form className="search-shell" role="search" onSubmit={submit}>
      <InputGroup className="searchbar rounded-pill w-100">
        <FormControl
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Sök efter produkt, kategori eller artikel"
          aria-label="Sök"
          className="search-input rounded-pill"
        />
        <Button
          type="submit"
          aria-label="Sök"
          variant="link"
          className="search-btn d-flex align-items-center justify-content-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
            <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </Button>
      </InputGroup>
    </form>
  );
}
