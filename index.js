const axios = require('axios')
const config = require('./config.json')

async function main() {
  try {
    console.log('check ddns', new Date())
    // Load Config
    if (config.hostnames.length == 0 || !config.email || !config.token || !config.queryUrl) { throw Error('Config missing') }
    const cfAuthHeaders = {
      'X-Auth-Email': config.email,
      'X-Auth-Key': config.token
    }

    let localIp = (await axios.get(config.queryUrl)).data
    localIp = localIp.replace(/[\r\n]/g, "");

    for (const item of config.hostnames) {
      const { hostname, proxied } = item
      // Get Zone ID
      const cfZoneIdReqUrl = `https://api.cloudflare.com/client/v4/zones?name=${encodeURI(`${hostname.split('.').reverse()[1]}.${hostname.split('.').reverse()[0]}`)}`
      const cfZoneIdRes = await axios.get(cfZoneIdReqUrl, { headers: cfAuthHeaders })
      if (cfZoneIdRes.data.result.length <= 0) { throw Error('Zone not found') }
      const cfZoneId = cfZoneIdRes.data.result[0].id
      // console.log('Zone ID: ', cfZoneId)

      // Get DNS Record ID
      const cfDnsIdReqUrl = `https://api.cloudflare.com/client/v4/zones/${encodeURI(cfZoneId)}/dns_records?name=${encodeURI(hostname)}`
      const cfDnsIdRes = await axios.get(cfDnsIdReqUrl, { headers: cfAuthHeaders })
      if (cfDnsIdRes.data.result.length <= 0) { throw Error('DNS record not found') }
      const results = await Promise.all(cfDnsIdRes.data.result.map(async cfDnsRecord => {
        // console.log('DNS Record ID: ', cfDnsRecord.id)
        let content
        switch (cfDnsRecord.type) {
          case 'A':
            if (cfDnsRecord.content == localIp) {
              return { data: { success: true, message: `${cfDnsRecord.name}:${cfDnsRecord.content} do not need to change.` } }
            }
            content = localIp
            break
          // case 'AAAA':
          //   content = await publicIp.v6()
          //   break
          default:
            console.error(`DNS Record Type unsupported: ${cfDnsRecord.type}`)
            return
        }
        // Update DNS Record
        const cfPutReqUrl = `https://api.cloudflare.com/client/v4/zones/${encodeURI(cfZoneId)}/dns_records/${encodeURI(cfDnsRecord.id)}`
        const cfPutReqData = {
          'type': cfDnsRecord.type,
          'name': cfDnsRecord.name,
          content, proxied
        }
        return axios.put(cfPutReqUrl, cfPutReqData, { headers: cfAuthHeaders })
      }))
      results.forEach(result => {
        if (!result || !result.data) {
          console.error(`Warning: null result received, see above for error messages`)
          return
        }
        if (result.data.success === true) {
          console.log(`DNS Record update success: `, JSON.stringify(result.data, undefined, 2))
        } else {
          console.error(`DNS Record update failed: `, JSON.stringify(result.data.errors, undefined, 2))
        }
      })
    }
  } catch (e) {
    console.error(e)
  }
}

// entry
main()
