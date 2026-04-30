'use client';
import * as React from 'react';
import styles from './combobox.module.css';

function CheckIcon(props) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function ClearIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ChevronDownIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default class Combobox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      inputValue: '',
      isOpen: false,
      activeIndex: -1,
    };

    this.inputRef = React.createRef();
    this.dropdownRef = React.createRef();
    
    this.inputId = 'combobox-id-' + Math.random().toString(36).substring(2, 9);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.selectedItems !== prevProps.selectedItems) {
      this.setState({ selected: this.props.selectedItems || [] });
    }

    if (
      prevState.inputValue !== this.state.inputValue ||
      prevState.selected !== this.state.selected ||
      prevProps.items !== this.props.items 
    ) {
      if (this.state.activeIndex !== -1) {
        this.setState({ activeIndex: -1 });
      }
    }
  }

  handleClickOutside = (e) => {
    if (
      this.dropdownRef.current &&
      !this.dropdownRef.current.contains(e.target) &&
      this.inputRef.current &&
      !this.inputRef.current.contains(e.target)
    ) {
      this.setState({ isOpen: false });
    }
  };

  getFilteredOptions = () => {
    const { selected, inputValue } = this.state;
    const items = this.props.items || []; 
    
    const selectedValues = new Set(selected.map((item) => item.value));
    
    return items.filter(
      (item) =>
        !selectedValues.has(item.value) &&
        item.label.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  selectItem = (item) => {
    this.setState(
      (prevState) => ({
        selected: [...prevState.selected, item],
        inputValue: '',
        isOpen: false,
      }),
      () => {
        this.inputRef.current?.focus();
        
        if (this.props.onSelectionChange) {
          this.props.onSelectionChange(this.state.selected);
        }
      }
    );
  };

  removeItem = (item) => {
    this.setState(
      (prevState) => ({
        selected: prevState.selected.filter((i) => i.value !== item.value),
      }),
      () => {
        if (this.props.onSelectionChange) {
          this.props.onSelectionChange(this.state.selected);
        }
      }
    );
  };

  handleInputChange = (e) => {
    this.setState({
      inputValue: e.target.value,
      isOpen: true,
    });
  };

  handleKeyDown = (e) => {
    const { isOpen, activeIndex, inputValue, selected } = this.state;
    const filteredOptions = this.getFilteredOptions();

    if (!isOpen) {
      this.setState({ isOpen: true });
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.setState((prevState) => ({
          activeIndex: Math.min(prevState.activeIndex + 1, filteredOptions.length - 1),
        }));
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.setState((prevState) => ({
          activeIndex: Math.max(prevState.activeIndex - 1, 0),
        }));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredOptions[activeIndex]) {
          this.selectItem(filteredOptions[activeIndex]);
        }
        break;
      case 'Escape':
        this.setState({ isOpen: false });
        break;
      case 'Backspace':
        if (inputValue === '' && selected.length > 0) {
          this.removeItem(selected[selected.length - 1]);
        }
        break;
    }
  };

  render() {
    const { selected, inputValue, isOpen, activeIndex } = this.state;
    const filteredOptions = this.getFilteredOptions();

    return (
      <div className={styles.root}>

        <div className={styles.inputWrapper}>
          <div className={styles.inputGroup}>
            <input
              ref={this.inputRef}
              id={this.inputId}
              type="text"
              placeholder={this.props.placeholder || "Pesquisar..."}
              autoComplete="off"
              value={inputValue}
              onChange={this.handleInputChange}
              onFocus={() => this.setState({ isOpen: true })}
              onKeyDown={this.handleKeyDown}
              aria-autocomplete="list"
              aria-expanded={isOpen}
              role="combobox"
              className={styles.input}
            />
            {inputValue && (
              <button
                aria-label="Clear input"
                onClick={() => {
                  this.setState({ inputValue: '' }, () => {
                    this.inputRef.current?.focus();
                  });
                }}
                className={styles.clearButton}
              >
                <ClearIcon width={14} height={14} />
              </button>
            )}
            <button
              aria-label="Toggle dropdown"
              onClick={() => {
                this.setState(
                  (prevState) => ({ isOpen: !prevState.isOpen }),
                  () => {
                    this.inputRef.current?.focus();
                  }
                );
              }}
              className={styles.triggerButton}
            >
              <ChevronDownIcon
                width={14}
                height={14}
                className={`${styles.chevronIcon} ${isOpen ? styles.open : ''}`}
              />
            </button>
          </div>

          {isOpen && (
            <div ref={this.dropdownRef} className={styles.dropdown}>
              {filteredOptions.length === 0 ? (
                <div className={styles.emptyMessage}>Nenhum item encontrado.</div>
              ) : (
                <ul role="listbox" className={styles.optionList}>
                  {filteredOptions.map((item, i) => (
                    <li
                      key={item.value}
                      role="option"
                      aria-selected={false}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => this.selectItem(item)}
                      onMouseEnter={() => this.setState({ activeIndex: i })}
                      className={`${styles.option} ${
                        i === activeIndex ? styles.active : ''
                      }`}
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        
      </div>
    );
  }
}