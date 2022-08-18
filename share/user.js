function mobileScroll() {

}

var videoMain = document.querySelector(".video-main");
var playingVideos = [];

videoMain.addEventListener("click", (event) => {
   console.log(event.target);

   if (event.target.paused) {
      event.target.scrollIntoView({ behavior: "smooth", block: "end" });
      playingVideos.forEach((video) => video.pause());
      playingVideos = [];
      event.target.play();
      playingVideos.push(event.target);
      // document.addEventListener("scroll", () => {
      //    console.log(window.pageYOffset - event.target.offsetTop);
      // })
   } else event.target.pause();
});

videoMain.addEventListener("dblclick", (event) => {
   event.target.requestFullscreen();
   event.target.play();
   event.target.controls = true;
});

var scrollVal
document.addEventListener("scroll", (event) => {
   if (scrollVal) {
      if (window.scrollY < scrollVal) {
         console.log("up")
         console.log(scrollVal)
         scrollVal = window.scrollY;
      }
      else if (window.scrollY > scrollVal) {
         console.log("down")
         console.log(scrollVal)
         scrollVal = window.scrollY;
      }
   }
   else {
      scrollVal = window.scrollY;
   }
})
