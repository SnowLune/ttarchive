ttarchive="./ttarchive.sh"
binName="ttarchive"
share="./share"

if [ -d ~/.local/bin ]; then
   cp -uv "$ttarchive" ~/.local/bin/"$binName"
else
   echo "~/.local/bin does not exist."
fi

if [ -d ~/.local/share ]; then
   cp -urv "$share"/* ~/.local/share/ttarchive
else
   echo "~/.local/share does not exist."
fi
