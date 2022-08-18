function mobileScroll() {

}

var toTop = document.querySelector(".to-top-icon a");
var toBottom = document.querySelector(".to-bottom-icon a");

toTop.addEventListener("click", (event) => {
   event.preventDefault();
   window.scroll({top: 0, left: 0, behavior: "smooth"});
});

toBottom.addEventListener("click", (event) => {
   event.preventDefault();
   window.scroll({top: document.body.scrollHeight, left: 0, behavior: "smooth"});
});

var videoMain = document.querySelector(".video-main");
var playingVideos = [];

videoMain.addEventListener("click", (event) => {
   if (event.target.paused) {
      event.target.scrollIntoView({ behavior: "smooth", block: "end" });
      playingVideos.forEach((video) => video.pause());
      playingVideos = [];
      event.target.play();
      playingVideos.push(event.target);
   } else event.target.pause();
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls = true;
});

var scrollVal;
document.addEventListener("scroll", (event) => {
   if (scrollVal) {
      // Scroll Up
      if (window.scrollY < scrollVal) {
         scrollVal = window.scrollY;
      }
      // Scroll Down
      else if (window.scrollY > scrollVal) {
         scrollVal = window.scrollY;
      }
   }
   else {
      scrollVal = window.scrollY;
   }
})
