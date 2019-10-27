
class Book {
  constructor(bookDomElement) {
    this.FINISHING_STEP = 0.1;
    this.FINISHING_DELAY = 16;

    this.bookElem = null;
    this.pages = [];
    this.currentPage = null;
    this.activePage = null;
    this.futurePage = null;
    this.mouseStart = null;
    this.activePagePosition = null;
    this.finishingDirection = 0;
    this.finishingTicker = null;
    this.activeSide = null;

    if (bookDomElement) {
      this.init(bookDomElement);
    }
  }

  init(bookDomElement) {
    this.bookElem = bookDomElement;
    this.pages = this.bookElem.querySelectorAll('.book__page');

    this._setCurrentPage(-1);

    if (window.PointerEvent) {
      this.bookElem.addEventListener('pointerdown', this._dragStart.bind(this));
      window.addEventListener('pointermove', this._drag.bind(this));
      window.addEventListener('pointerup', this._dragEnd.bind(this));
      window.addEventListener('pointercancel', this._dragEnd.bind(this));
    } else {
      this.bookElem.addEventListener('touchstart', this._dragStart.bind(this));
      window.addEventListener('touchmove', this._drag.bind(this));
      window.addEventListener('touchend', this._dragEnd.bind(this));
      window.addEventListener('touchcancel', this._dragEnd.bind(this));

      this.bookElem.addEventListener('mousedown', this._dragStart.bind(this));
      window.addEventListener('mousemove', this._drag.bind(this));
      window.addEventListener('mouseup', this._dragEnd.bind(this));
    }
  }

  _setActiveSide(position) {
    let newSide;
    if (position === null) {
      newSide = null;
    } else {
      newSide = position > 0 ? 'right' : 'left';
    }

    if (newSide === this.activeSide) {
      return;
    }

    if (this.activeSide === 'left') {
      this.bookElem.classList.remove('book_active-side_left');
    }

    if (this.activeSide === 'right') {
      this.bookElem.classList.remove('book_active-side_right');
    }

    if (newSide) {
      this.bookElem.classList.add(`book_active-side_${newSide}`);
    }

    this.activeSide = newSide;
  }

  _setCurrentPage(newCurrentPage) {
    this.pages[this.currentPage - 2] && this.pages[this.currentPage - 2].classList.remove('book__page_previous', 'book__page_first-previous');
    this.pages[this.currentPage - 1] && this.pages[this.currentPage - 1].classList.remove('book__page_previous', 'book__page_second-previous');
    this.pages[this.currentPage] && this.pages[this.currentPage].classList.remove('book__page_current');
    this.pages[this.currentPage + 1] && this.pages[this.currentPage + 1].classList.remove('book__page_current');
    this.pages[this.currentPage + 2] && this.pages[this.currentPage + 2].classList.remove('book__page_next', 'book__page_first-next');
    this.pages[this.currentPage + 3] && this.pages[this.currentPage + 3].classList.remove('book__page_next', 'book__page_second-next');

    this.currentPage = newCurrentPage;

    this.pages[this.currentPage - 2] && this.pages[this.currentPage - 2].classList.add('book__page_previous', 'book__page_first-previous');
    this.pages[this.currentPage - 1] && this.pages[this.currentPage - 1].classList.add('book__page_previous', 'book__page_second-previous');
    this.pages[this.currentPage] && this.pages[this.currentPage].classList.add('book__page_current');
    this.pages[this.currentPage + 1] && this.pages[this.currentPage + 1].classList.add('book__page_current');
    this.pages[this.currentPage + 2] && this.pages[this.currentPage + 2].classList.add('book__page_next', 'book__page_first-next');
    this.pages[this.currentPage + 3] && this.pages[this.currentPage + 3].classList.add('book__page_next', 'book__page_second-next');
  }

  _setActivePage(newActivePage) {
    this.pages[this.activePage] && this.pages[this.activePage].classList.remove('book__page_active', 'book__page_first-active');
    this.pages[this.activePage + 1] && this.pages[this.activePage + 1].classList.remove('book__page_active', 'book__page_second-active');

    this.activePage = newActivePage;
    if (this.activePage === null) {
      this._setActiveSide(null);
      return;
    }

    this.pages[this.activePage] && this.pages[this.activePage].classList.add('book__page_active', 'book__page_first-active');
    this.pages[this.activePage + 1] && this.pages[this.activePage + 1].classList.add('book__page_active', 'book__page_second-active');
  }

  _setFuturePage(newFuturePage) {
    this.pages[this.futurePage] && this.pages[this.futurePage].classList.remove('book__page_future');
    this.pages[this.futurePage + 1] && this.pages[this.futurePage + 1].classList.remove('book__page_future');

    this.futurePage = newFuturePage;
    if (this.futurePage === null) {
      return;
    }

    this.pages[this.futurePage] && this.pages[this.futurePage].classList.add('book__page_future');
    this.pages[this.futurePage + 1] && this.pages[this.futurePage + 1].classList.add('book__page_future');
  }

  _setActivePagePosition(position) {
    this.activePagePosition = Math.min(1, Math.max(-1, position));
    this.bookElem.style.setProperty('--active-page-position', this.activePagePosition);
    this._setActiveSide(position);
  }

  _stopFinishing() {
    if (!this.finishingTicker) {
      return;
    }
    clearInterval(this.finishingTicker);
    this.finishingTicker = null;
  }

  _finishing() {
    if (this.activePagePosition === 1) {
      this._stopFinishing();
      this._setCurrentPage(this.activePage - 1);
      this._setActivePage(null);
      this._setFuturePage(null);
    } else if (this.activePagePosition === -1) {
      this._stopFinishing();
      this._setCurrentPage(this.activePage + 1);
      this._setActivePage(null);
      this._setFuturePage(null);
    }

    this._setActivePagePosition(this.activePagePosition + this.finishingDirection * this.FINISHING_STEP);
  }

  _startFinishing(direction) {
    this._stopFinishing();

    if (direction !== undefined) {
      this.finishingDirection = direction;
    } else {
      this.finishingDirection = Math.sign(this.activePagePosition) || -1;
    }
    this.finishingTicker = setInterval(this._finishing.bind(this), this.FINISHING_DELAY);
  }

  _getPosX(e) {
    let clientX;
    if (['touchstart', 'touchmove'].includes(e.type)) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const x = clientX - this.bookElem.offsetLeft + window.scrollX - this.bookElem.offsetWidth / 2;
    return x / this.bookElem.offsetWidth * 2;
  }

  _dragStart(e) {
    e.preventDefault();

    if (this.mouseStart !== null) {
      return;
    }

    const posX = this._getPosX(e);

    if (Math.abs(posX) < 0.25) {
      return;
    }

    if (posX > 0) {
      if (this.currentPage + 2 >= this.pages.length) {
        return;
      }

      this._setActivePage(this.currentPage + 1);
      this._setActivePagePosition(1);
      this._setFuturePage(this.currentPage + 2);
    } else {
      if (this.currentPage === -1) {
        return;
      }

      this._setActivePage(this.currentPage - 1);
      this._setActivePagePosition(-1);
      this._setFuturePage(this.currentPage - 2);
    }
    this.mouseStart = posX;
  }

  _drag(e) {
    if (this.mouseStart === null) {
      return;
    }

    e.preventDefault();
    this._setActivePagePosition(this._getPosX(e) / Math.abs(this.mouseStart));
  }

  _dragEnd(e) {
    if (this.mouseStart === null) {
      return;
    }

    e.preventDefault();
    this.mouseStart = null;
    this._startFinishing();
  }
}
