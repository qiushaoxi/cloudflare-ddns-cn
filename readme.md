# Cloudflare DDNS

NodeJS Script for updating CloudFlare DNS record of servers with dynamic IP.

## Dependencies

- axios

## Usage

### Setup

```sh
$ git clone https://github.com/qiushaoxi/cloudflare-ddns-cn.git
$ cd cloudflare-ddns-cn
$ npm install
```

### Configuration

```sh
mv config.sample.json config.json
```
Fill in your hostnames, email and api token in `config.json`

#### Sample JSON

```json
{
  "hostnames": [
    {
      "hostname": "baidu.com",
      "proxied": true
    },
    {
      "hostname": "google.com",
      "proxied": true
    }
  ],
  "email": "user@example.com",
  "token": "c2547eb745079dac9320b638f5e225cf483cc5cfdda41",
  "queryUrl": "http://members.3322.org/dyndns/getip"
}
```

### Run

```sh
$ node index.js
```

### Schedule auto updates

You may use crontab to schedule updates: (every 15 minutes in sample below)

```
*/15 * * * * /usr/local/bin/node /path/to/repo/index.js
```

Or you can use pm2 tool to schedule updates

Change frequency in pm2.json

```
pm2 start pm2.json
```

stop pm2 schedule

```
pm2 delete  pm2.json
```