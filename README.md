## Logarithmic logs streamer demo

This demo is capable of streaming a log file to a destination lacking append
operations (eg: S3).

The chunking is done in a way that's a compromise between:

 - uploading every chunk separately: O(n) bytes to upload, but O(n) operations
   for the browser to perform when opening a stream-in-progress log file

 - uploading and reuploading the content as one file, as it grows: O(n^2) bytes
   to upload

The approach here uploads an amount of data that's bounded by O(n\*lg n) in
such a way that the browser never needs to perform more than O(lg n)
operations.

There are at least two annoying bugs:

 - the client attempts to use the Range option to avoid unnecessarily
   downloading data that it already has, but that's not supported by Python's
   http.server, leading to problems.

 - the chunking is performed on byte boundaries in the server but we count
   characters in the client.  That means that anything non-ascii is likely to
   break badly.  Javascript is lacking a good "bytes" type similar to Python,
   with a full range of convenient operations.

### Testing the proof of concept locally:

```
rm -rf srv
make bots
```

```
python3 -m http.server --directory srv
```

```
./s3-streamer --directory srv -- sh -c \
  'echo Attachments: $TEST_ATTACHMENTS; for i in $(seq 60); do echo $i; sleep 1; done'
```

To view the log: http://0.0.0.0:8080/log.html

```
touch [path to attachments]/abc
echo 'Test result: abc' >> log
```

Alternatively, for S3 (with the correct credentials):

```
./s3-streamer --s3 https://cockpit-logs.us-east-1.linodeobjects.com/ --attachments attachments log
```

To view the log: https://cockpit-logs.us-east-1.linodeobjects.com/
