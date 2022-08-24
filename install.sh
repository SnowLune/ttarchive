ttarchive="./ttarchive.sh"
binName="ttarchive"
share="./share"

if [ -d ~/.local/bin ]; then
   cp -uv "$ttarchive" ~/.local/bin/"$binName"
else
   echo "~/.local/bin does not exist."
   exit 1
fi

if [ -d ~/.local/share ]; then
   if [ ! -d ~/.local/share/"$binName" ]; then
      mkdir ~/.local/share/"$binName"
   fi
   cp -urv "$share"/* ~/.local/share/"$binName"
else
   echo "~/.local/share does not exist."
   exit 1
fi
