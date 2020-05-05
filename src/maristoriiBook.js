let pages;
let book;
let control;

const onPageVisibilityChange = ({ detail: { index, visible } }) => {
  if (!visible) {
    return;
  }

  const { onceOpened, video, image } = pages[index];

  if (onceOpened) {
    return;
  }

  pages[index].onceOpened = true;

  if (video) {
    video.removeAttribute('preload');
    video.load();
  }

  if (image) {
    image.setAttribute('src', image.dataset.src);
  }
};

const tryToPlay = () => {
  if (!book) {
    return;
  }

  const currentPage = book.currentPage;
  const visiblePages = book.visiblePages;

  visiblePages.forEach(pageIndex => {
    const page = pages[pageIndex];
    if (!page.video || page.isDependant || !page.video.readyState === 4 || page.played) {
      return;
    }

    const isCurrent = pageIndex === currentPage || pageIndex === (currentPage + 1);

    if (!page.dependantVideo) {
      if (isCurrent || (page.video.loop && book.isPageTurning)) {
        page.video.play();
        page.played = true;
      }

      return;
    }

    if (!page.dependantVideo.readyState === 4) {
      return;
    }

    if (isCurrent || (page.video.loop && book.isPageTurning)) {
      page.video.play();
      page.dependantVideo.play();
      page.played = true;
    }
  });
};

const syncDependencies = () => {
  book.visiblePages.forEach(pageIndex => {
    const page = pages[pageIndex];
    if (!page.video || !page.dependantVideo || !page.played) {
      return;
    }

    if (Math.abs(page.video.currentTime - page.dependantVideo.currentTime) < 0.05) {
      return;
    }

    page.dependantVideo.currentTime = page.video.currentTime;
    page.video.currentTime = page.dependantVideo.currentTime;
  });
};

const onVideoReady = event => {
  tryToPlay();
};

const onCurrentPageChange = ({ detail: { currentPage, previousPage } }) => {
  if (currentPage === previousPage) {
    return;
  }

  tryToPlay();
  [previousPage, previousPage + 1].forEach(pageIndex => {
    const page = pages[pageIndex];

    if (!page || !page.video || page.isDependant || !page.video.readyState === 4) {
      return;
    }

    page.video.pause();
    page.video.currentTime = 0;
    page.played = false;

    if (!page.dependantVideo || !page.dependantVideo.readyState === 4) {
      return;
    }

    page.dependantVideo.pause();
    page.dependantVideo.currentTime = 0;
  });
};

window.onload = () => {
  const bookDomElement = document.getElementById('book');

  pages = Array.from(bookDomElement.getElementsByClassName('book__page'))
    .map((page, pageIndex) => ({
      video: page.getElementsByTagName('video')[0],
      image: page.getElementsByTagName('img')[0],
      onceOpened: false,
      pageIndex,
      played: false,
    }))
  ;

  let controlPageIndex;
  pages.forEach(({ video, pageIndex }) => {
    if (!video) {
      return;
    }

    video.$pageIndex = pageIndex;

    const progressHandler = (e) => {
      console.log('progress', pageIndex, e.target.duration, e.target, e.target.buffered.length && e.target.buffered.end(0));
      if (e.total && e.loaded) {
        console.log(e.loaded / e.total);
        pages[pageIndex].page.style = `--loading-progress: ${e.loaded / e.total}`;
      }
    }

    video.addEventListener('progress', progressHandler, false);

    if (video.dataset.dependant) {
      pages[pageIndex].isDependant = true;
    }

    if (video.dataset.leadof) {
      pages[pageIndex].dependantVideo = document.getElementById(video.dataset.leadof);
    }

    if (video.id === 'control-video') {
      controlPageIndex = pageIndex;
    }

    video.addEventListener('canplaythrough', onVideoReady);
  });

  bookDomElement.addEventListener('pageVisibilityChange', onPageVisibilityChange);
  bookDomElement.addEventListener('currentPageChange', onCurrentPageChange);
  book = new Book(bookDomElement);

  control = new Control({
    page: document.getElementById('control'),
    video: document.getElementById('control-video'),
    book,
    pageIndex: controlPageIndex,
  });

  setInterval(syncDependencies, 500);

  let fullscreenEnabled = false;
  const body = document.getElementById('body');

  if (body.requestFullscreen) {
    body.classList.add('body_canBeFullscreen');
  }

  document.getElementById('fullscreenButton').addEventListener('click', () => {
    if(fullscreenEnabled) {
      document.exitFullscreen();
      fullscreenEnabled = false;
      body.classList.remove('body_fullscreen');
    } else {
      body.requestFullscreen();
      fullscreenEnabled = true;
      body.classList.add('body_fullscreen');
    }
  });
};
