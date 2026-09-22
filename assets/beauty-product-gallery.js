class BeautyProductGallery extends HTMLElement {
  connectedCallback() {
    this.image = this.querySelector('[data-gallery-image]');
    this.dialog = this.querySelector('[data-gallery-dialog]');
    this.dialogImage = this.querySelector('[data-gallery-dialog-image]');

    this.addEventListener('click', (event) => {
      const thumbnail = event.target.closest('[data-gallery-thumb]');
      if (thumbnail) this.selectMedia(thumbnail);
      if (event.target.closest('[data-gallery-zoom]')) this.openDialog();
      if (event.target.closest('[data-gallery-close]')) this.dialog?.close();
    });

    this.dialog?.addEventListener('click', (event) => {
      if (event.target === this.dialog) this.dialog.close();
    });
  }

  selectMedia(thumbnail) {
    if (!this.image) return;
    this.image.src = thumbnail.dataset.imageSrc;
    this.image.srcset = thumbnail.dataset.imageSrcset;
    this.image.alt = thumbnail.dataset.imageAlt;

    this.querySelectorAll('[data-gallery-thumb]').forEach((button) => {
      const selected = button === thumbnail;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  openDialog() {
    if (!this.dialog || !this.dialogImage || !this.image) return;
    this.dialogImage.src = this.image.currentSrc || this.image.src;
    this.dialogImage.alt = this.image.alt;
    this.dialog.showModal();
  }
}

if (!customElements.get('beauty-product-gallery')) {
  customElements.define('beauty-product-gallery', BeautyProductGallery);
}
