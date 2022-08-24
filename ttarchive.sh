#!/bin/bash

ttarchiveConfig=~/.config/ttarchive/ttarchive.config

if [ -f "$ttarchiveConfig" ]; then
   . "$ttarchiveConfig"
fi

if [ "$ttarchiveHome" = "" ]; then
   echo "ttarchiveHome environment variable not set. Exiting..."
   exit 1
fi

if [ "$ttarchiveShare" = "" ]; then
   ttarchiveShare=~/.local/share/ttarchive
fi

if [ ! -d "$ttarchiveShare" ]; then
   echo "ERROR: $ttarchiveShare is missing. Exiting..."
   exit 1
fi

if [ "$1" = "" ]; then
   echo "ERROR: No input file or username provided."
   exit 1
fi

# Check path for yt-dlp
if [ "$(which yt-dlp)" == "" ]; then
   echo "ERROR: yt-dlp not found. It is required to download content."
   echo "Please install the latest version. See: [https://github.com/yt-dlp/yt-dlp#installation]"
   exit 1
fi

if [ ! -f "$1" ]; then
   # Check for user directory
   if [ -d "$ttarchiveHome"/user/"$1" ]; then
      if [ -f "$ttarchiveHome"/user/"$1"/"$1".list ]; then
         echo "Found URL list for $1"
         inputFile="$ttarchiveHome"/user/"$1"/"$1".list
      else
         echo "ERROR: Found user directory but no URL list for $1."
         echo "Please save a new HTML page for $1. Exiting..."
         exit 1
      fi
   else
      echo "ERROR: No user directory for $1 found."
      echo "Please save a new HTML page for $1. Exiting..."
      exit 1
   fi
else
   inputFile="$1"
fi

# Set username
username=`ls "$inputFile" | sed -e 's%^.*@%@%' -e 's%).*$%%' -e 's%.list%%'`

# Check if filename gave us a valid username
if [ "$username" = "" ] || [ "${username:0:1}" != "@" ]; then
   echo "ERROR: Invalid input filename. Must contain @username."
   exit 1
fi

# Directory for this user
outputDir="$ttarchiveHome"/user/"$username"

# Create /user directory if it does not exist
if [ ! -d "$ttarchiveHome/user" ]; then
   mkdir "$ttarchiveHome"/user
   # Can safely assume if /user doesn't exist then @username dir doesn't exist
   mkdir "$outputDir" "$outputDir"/video

# User directory exists
elif [ -d "$outputDir" ]; then
   echo "Found user directory for [ $username ]."

   # User's video directory DOES NOT exist
   if [ ! -d "$outputDir"/video ]; then
      echo "No video directory found. Creating one..."
      mkdir "$outputDir"/video

   # User's video directory DOES exist
   elif [ -d "$outputDir"/video ]; then
      echo "Found video directory for [ $username ]."

   # Catch
   else
      echo "READ ERROR: Error reading directories"
      exit 1
   fi

# User directory DOES NOT exist
elif [ ! -d "$outputDir" ]; then
   echo "No user directory found for [ $username ]. Creating one..."
   mkdir "$outputDir" "$outputDir"/video

# Catch
else
   echo "READ ERROR: Error reading directories"
   exit 1
fi

# List of video URLs grepped from the user's TikTok webapp page
videoList=$(grep -o -E "https://www.tiktok.com/$username/video/[[:digit:]]+" "$inputFile")
videoListFile="$outputDir"/"$username".list
echo $videoList | tr " " "\n" > "$videoListFile"

# Create list of mp4s
localVideoFiles=$(find "$outputDir"/video -maxdepth 1 -type f -iregex ".*.mp4")

for i in $localVideoFiles; do 
   # Cut out ID
   currentID=$(basename -s .mp4 "$i")
   
   if [[ "$currentID" != "" ]]; then
      echo "Found $username video: $currentID"

      # Remove videos from videoList
      tempVideoList=$(echo $videoList \
         | sed "s#https://www.tiktok.com/$username/video/$currentID##")

      # Save videoList
      videoList=$tempVideoList
   fi
done

echo $videoList | tr " " "\n" > "$videoListFile".tmp

if [ "$videoList" != "" ]; then
   echo -n "Found $(echo $videoList | tr " " "\n" | sed '/^$/d' | wc -l) new videos "
   echo "from $username"
   echo "Starting download..."

   yt-dlp -f "b*[vcodec=h264]" --progress --write-thumbnail --write-description --write-info-json --no-mtime --no-overwrites \
      -P "$outputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 1 \
      -a "$videoListFile".tmp

else
   echo "No new videos from $username"
fi

# Check metadata
echo "Validating metadata using primary video list..."
# Overwrite temp file
echo -n "" > "$videoListFile".tmp

function addToMissingMetadataList {
   echo "$i" >> "$videoListFile".tmp
}

for i in $(cat "$videoListFile" | sed '/^$/d'); do
   currentID=$(echo "$i" | sed "s%^.*/%%")
   # Check for missing metadata
   if [ ! -f "$outputDir"/video/"$currentID".description ]; then
      addToMissingMetadataList
   elif [ ! -f "$outputDir"/video/"$currentID".info.json ]; then
      addToMissingMetadataList
   elif [ ! -f "$outputDir"/video/"$currentID".webp ]; then
      addToMissingMetadataList
   fi
done

if [ "$(cat "$videoListFile".tmp)" != "" ]; then
   missingCount=$(cat "$videoListFile".tmp | sed '/^$/d' |  wc -l)
   echo "Missing metadata for $missingCount video$([ "$missingCount" -gt 1 ] && echo "s")."
   echo "Downloading missing metadata..."
   yt-dlp --skip-download --write-thumbnail --write-description --write-info-json --no-mtime --no-overwrites \
      -P "$outputDir/video" -o "%(id)s.%(ext)s" --sleep-interval 0.1 \
      -a "$videoListFile".tmp
else
   echo "Successfully validated video metadata."
fi

####################
# Generate homepage
####################

# Make directories and copy files

if [ ! -d "$ttarchiveHome" ]; then
   mkdir "$ttarchiveHome"
fi

if [ ! -d "$ttarchiveHome"/assets ]; then
   mkdir "$ttarchiveHome"/assets
fi

cp "$ttarchiveShare"/home.html "$ttarchiveHome"/index.html
cp -ur "$ttarchiveShare"/assets "$ttarchiveHome"

# Set user link components
userLinkComponent=$(cat $ttarchiveShare/components/user-link.html | tr -d "\n")
userThumbComponent=$(cat $ttarchiveShare/components/user-preview-image.html \
   | tr -d "\n")
userThumbRowComponent=$(cat \
   $ttarchiveShare/components/user-gallery-preview-row.html | tr -d "\n")
userLinkElements=""

### Loop through all user directories
for i in "$ttarchiveHome"/user/@*; do
   currentUsername=$(basename "$i")

   # Thumbnails for homepage
   userThumbElements=""
   userThumbRowElements=""
   cd "$ttarchiveHome"/user/"$currentUsername"
   thumbnails=$(find video/*.webp -maxdepth 1 -type f -iname "*.webp" | sort \
      | tail -9)
   for j in {1..9}; do
      previewThumb=$(echo $thumbnails | tr " " "\n" | sed -n "$j"p)
      if [ "$previewThumb" = "" ]; then break; fi
      
      tempUserThumbElements=$userThumbElements
      newUserThumbElement=$(echo "$userThumbComponent" | sed "s#THUMBNAIL_URI#./user/$currentUsername/$previewThumb#")
      userThumbElements="$newUserThumbElement""$tempUserThumbElements"

      if [ $(($j % 3)) -eq 0  ]; then
         tempUserThumbRowElements=$userThumbRowElements
         newUserThumbRowElement=$(echo $userThumbRowComponent | sed "s#PREVIEW_IMAGES#$userThumbElements#")
         userThumbRowElements="$newUserThumbRowElement""$tempUserThumbRowElements"
         userThumbElements=""
      fi
   done

   tempUserLinkElements=$userLinkElements
   newUserLink=$(echo "$userLinkComponent" | sed -e "s#USERNAME#$currentUsername#g" \
      -e "s#PREVIEW_ROWS#$userThumbRowElements#")
   userLinkElements="$tempUserLinkElements""$newUserLink"

   # Create HTML for user
   cp "$ttarchiveShare"/user.html "$ttarchiveHome"/user/"$currentUsername"/index.html

   videoComponent=$(cat $ttarchiveShare/components/video.html | tr -d "\n")

   ### Generate video javascript object
   echo "Generating html for $currentUsername..."
   cd "$ttarchiveHome"/user/"$currentUsername"/video

   for i in *.mp4; do
      # ID
      currentID=$(basename -s .mp4 "$i")
      # Thumbnail
      thumbnail=$(echo $i | sed 's#mp4#webp#')
      # Description
      if [ -f "$currentID".description ]; then
         description=$(cat "$currentID".description | tr "\n" " ")
      else
         description=""
      fi
      
      videoObject="{ id: \"$currentID\", 
            file: \"./video/"$i"\", 
            description: \"unavailable\",
            thumbnail: \"./video/"$thumbnail"\",
            username: \"$currentUsername\" },"

      sed -i "s%VIDEO_OBJECTS%VIDEO_OBJECTS$(echo $videoObject)%" "$ttarchiveHome"/user/"$currentUsername"/index.html
   done

   sed -i "s%USERNAME%$currentUsername%g" "$ttarchiveHome"/user/"$currentUsername"/index.html
   sed -i "s%VIDEO_MAIN_ELEMENTS%%g" "$ttarchiveHome"/user/"$currentUsername"/index.html
   sed -i "s%VIDEO_OBJECTS%%g" "$ttarchiveHome"/user/"$currentUsername"/index.html

   if [ -f "$ttarchiveHome"/user/"$currentUsername"/index.html ]; then
      echo "Generated html page for $currentUsername: $ttarchiveHome/user/$currentUsername/index.html"
   fi
done

sed -i "s#USER_LINKS#$userLinkElements#g" "$ttarchiveHome"/index.html

if [ -f "$ttarchiveHome"/index.html ]; then
   echo "Generated ttarchive home page: $ttarchiveHome/index.html"
fi

# Delete temp file
if [ -f "$videoListFile".tmp ]; then
   rm "$videoListFile".tmp
fi

exit
