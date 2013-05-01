#lazydb

lazydb is an extremely simple key-value database written in *node.js*. Its goal is not to be fast, or efficient, or to give you guarantees of any sort, but rather to be dead simple.

##Installation

##Architechture

key: any node Buffer object (strings will be automatically converted into Buffers)
value: any node Buffer object (strings will be automatically converted into Buffers)

A lazydb databse consists of a folder which contains all the key-value pairs you put in it. A key-value pair cosists of two file, a .key file, which contains the key, and a .value file, which contains the value. The base name of the two files is the sha256 hash of the key.
Internally, lazydb treats keys and values as node Buffer objects, so there are no restrictions to what you can put in the database.

##Usage
lazydb is naturally very simple to use. Its api consists of the following methods:

+ open
+ get
+ put
+ del
+ lsk
