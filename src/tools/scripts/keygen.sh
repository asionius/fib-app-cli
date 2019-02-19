#! /bin/bash
echo "Enter your application name (FibAppDemo):"
read myapp
if [ -z $myapp ]; then
    myapp="FibAppDemo";
fi
echo "Enter file in which to save the key (/etc/${myapp}/pem/${myapp}.pem):"
read keypath
if [ -z $keypath ]; then
    keypath="/etc/${myapp}/pem/${myapp}.pem";
fi
pemdir=`dirname $keypath`
mkdir -p $pemdir

echo "openssl genrsa -out $keypath 2048"
openssl genrsa -out $keypath 2048
echo "Enter file in which to save the public key (/etc/${myapp}/pem/${myapp}.pub):"
read pubkey
if [ -z $pubkey ]; then
    pubkey="/etc/${myapp}/pem/${myapp}.pub"
fi
pemdir=`dirname $pubkey`
mkdir -p $pemdir
echo "openssl rsa -in $keypath -pubout > $pubkey"
openssl rsa -passin pass:"" -in $keypath -pubout > $pubkey
echo "done!"