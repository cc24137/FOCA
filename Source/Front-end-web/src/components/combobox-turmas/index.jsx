import { useState, useRef, useEffect } from 'react'
import './combobox-turmas.css'

export default function Combobox({ options, value, onChange, placeholder }) {
    const [query, setQuery] = useState(value || '');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    const filtered = options.filter(o =>
        o.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className='combobox-wrapper' ref={ref}>
            <input
                className='combobox-input'
                value={query}
                placeholder={placeholder}
                onChange={e => { setQuery(e.target.value); onChange(''); setOpen(true); }}
                onFocus={() => setOpen(true)}
            />
            {open && filtered.length > 0 && (
                <ul className='combobox-dropdown'>
                    {filtered.map((opt, i) => (
                        <li
                            key={i}
                            className='combobox-option'
                            onMouseDown={() => {
                                setQuery(opt);
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}