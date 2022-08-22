function saveScroll(el) {
   window.localStorage.setItem("scroll", JSON.stringify(el.scrollTop));
}

function getScroll(el) {
   let scroll = window.localStorage.getItem("scroll");
   if (scroll) {
      el.scroll({top: scroll});
   }
}

var home = document.querySelector(".home");


home.addEventListener("click", (event) => {
   console.dir(event.target);
});

home.addEventListener("scroll", (event) => {
   saveScroll(event.target);
});

document.addEventListener("DOMContentLoaded", () => {
   getScroll(home);
})
