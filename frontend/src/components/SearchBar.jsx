import { useState, useEffect, useRef } from 'react';
import { InputGroup, FormControl, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchRef]);

  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
      // Using the dedicated suggestions endpoint
      const res = await fetch(`${baseUrl}/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success && data.data) {
        setSuggestions(data.data.products || []);
      }
    } catch (err) {
      console.error("Search suggestion error:", err);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQ(val);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(val);
      setShowSuggestions(true);
    }, 300); // 300ms debounce
  };

  const handleSelect = (slug) => {
    navigate(`/p/${slug}`);
    setShowSuggestions(false);
    setQ('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      if (suggestions.length > 0) {
        handleSelect(suggestions[0].slug);
      }
    }
  };

  return (
    <div className="position-relative w-100" ref={searchRef}>
      <form className="search-shell" role="search" onSubmit={submit}>
        <div className="searchbar rounded-pill w-100 overflow-hidden d-flex align-items-center">
          <input
            value={q}
            onChange={handleChange}
            onFocus={() => { if (q.length >= 2) setShowSuggestions(true); }}
            type="search"
            placeholder="Sök efter produkt, kategori eller artikel"
            aria-label="Sök"
            className="search-input flex-grow-1 border-0 shadow-none"
            style={{
              paddingLeft: '20px',
              outline: 'none',
              background: 'transparent',
              height: '100%'
            }}
          />
          <button
            type="submit"
            aria-label="Sök"
            className="search-btn d-flex align-items-center justify-content-center border-0 p-0 me-2 cursor-pointer"
            style={{
              background: 'transparent',
              width: '40px',
              height: '40px',
              minWidth: '40px'
            }}
          >
            <Search size={20} strokeWidth={2.5} />
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ListGroup className="position-absolute w-100 mt-1 shadow-lg rounded-3 overflow-hidden border-0"
          style={{ zIndex: 1000, top: '100%', maxHeight: '400px', overflowY: 'auto', backgroundColor: 'white' }}>
          {suggestions.map((item, idx) => (
            <ListGroup.Item
              key={idx}
              action
              onClick={() => handleSelect(item.slug)}
              className="border-0 px-4 py-3 d-flex align-items-center border-bottom"
              style={{ transition: 'background 0.2s' }}
            >
              <div className="flex-grow-1">
                <div className="fw-medium text-dark">{item.name}</div>
              </div>
              <Search size={16} className="text-muted opacity-50" />
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
