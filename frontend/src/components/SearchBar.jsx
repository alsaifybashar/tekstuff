import { useState, useEffect, useRef } from 'react';
import { InputGroup, FormControl, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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
      // Create a dedicated search results page or just go to first suggestion for now
      // Since user didn't ask for a search page, let's try to be smart:
      // If we have precise matches, go to the first one?
      // Or maybe just show suggestions. 
      // User said "show relevant result based on the search word"
      // Let's implement a quick search redirect if exact match or navigate to search page (future)
      if (suggestions.length > 0) {
        handleSelect(suggestions[0].slug);
      } else {
        // Fallback: reload/navigate to home with search param (if we had a search page)
        // For now, let's just trigger a search alert or similar if we haven't built a search page yet.
        // Actually, let's build a simple redirect to the first result for better UX as implied by "live".
        // Or if nothing, do nothing.
      }
    }
  };

  return (
    <div className="position-relative w-100" ref={searchRef}>
      <form className="search-shell" role="search" onSubmit={submit}>
        <InputGroup className="searchbar rounded-pill w-100">
          <FormControl
            value={q}
            onChange={handleChange}
            onFocus={() => { if (q.length >= 2) setShowSuggestions(true); }}
            type="search"
            placeholder="Sök efter produkt, kategori eller artikel"
            aria-label="Sök"
            className="search-input rounded-pill border-0 bg-light"
            style={{ paddingLeft: '20px' }}
          />
          <Button
            type="submit"
            aria-label="Sök"
            variant="light"
            className="search-btn d-flex align-items-center justify-content-center rounded-pill border-0 bg-light pe-3"
            style={{ zIndex: 5 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="#6c757d" strokeWidth="2" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="#6c757d" strokeWidth="2" />
            </svg>
          </Button>
        </InputGroup>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ListGroup className="position-absolute w-100 mt-1 shadow-lg rounded-3 overflow-hidden"
          style={{ zIndex: 1000, top: '100%', maxHeight: '400px', overflowY: 'auto' }}>
          {suggestions.map((item, idx) => (
            <ListGroup.Item
              key={idx}
              action
              onClick={() => handleSelect(item.slug)}
              className="border-0 px-4 py-3 d-flex align-items-center"
            >
              <div className="flex-grow-1">
                <div className="fw-medium text-dark">{item.name}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dee2e6" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
