var homeEl = document.querySelector(".home");

function saveScroll(el) {
   window.localStorage.setItem("scroll", JSON.stringify(el.scrollTop));
}

function getScroll(el) {
   let scroll = window.localStorage.getItem("scroll");
   if (scroll) {
      el.scroll({top: scroll});
   }
}

homeEl.addEventListener("click", (event) => {
});

homeEl.addEventListener("scroll", (event) => {
   saveScroll(event.target);
});

document.addEventListener("DOMContentLoaded", () => {
   getScroll(homeEl);
})
