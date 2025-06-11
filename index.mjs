import * as client from 'openid-client'
import crypto from 'node:crypto'
import * as jose from 'jose'

let server = new URL('https://auth-dev.internal-nuggets.life/.well-known/openid-configuration') // Authorization Server's Issuer Identifier
let clientId = 'TIkadaktTlqehsS0WMdbT' // Client identifier at the Authorization Server
let clientConfig = JSON.parse('{"keys":[{"kty":"RSA","kid":"Gu7GtAnW9KlV9EBCBvukekpQGCcBmulzPmeAvfznGUA","use":"sig","alg":"RS256","e":"AQAB","n":"hRdHm5-KCes746F_sHylRu3mhQbOYSX-A9Wj7416QOT1F8MIW1IjK-cJ4ER9E6OuZ8knpqLhwYdcgSqmDyogizzl1BmZScTkUaSoTi51F_jFNaQNz6BTXOhcmXTI7ApQM88BZJy01jmuN8bRgFxpzYlu-046E53r_7o9vSVXDYFpBV3BZfXFzQaSC33aVUuV9IpmCzeKx6_zNc-R56ralJ4ull4hbDl3ETsVPvAvdFcUdAMSYkWOYjV5bdBPIxW2X9POeB-lf-xvgcUataL-io38W9VKNgYZBY74PXM50VMSMP_ULmJ9EXxDL5Y0-ZngoTqCIZ0roTz92jupFZWpww","d":"CxbL-Br8YOQxKr-3iGhySu0igl31TyHfvskLrjd_Aq4w_6hX52f6FzvaVk3OkBbYvrwDaj5zCfFx0y9PA79yU7egvKHfZEab8XODNHRpfDRVlikTn4OPvpN7t6uD3Crl0NNEHfJynNDUg8A0j3njtOTpEtZLP3wugDGv2DUmwjCx4YJnJeUy-UIxoGhGbEBfKkwX7ivUPcvDLfhJJh_4UcrRsT20IVh_xlss-e8d7tG4zoI3tlcFqskRyo89EFqKNh_uv0ClaXHyEYrii5yYqLTh8IJoelTGY0yBD392BmUZ5mApymRfvgT2sqC5oWiryaXFSo__yXmeAlm4KMu2EQ","p":"uPQNbxCsF77Dsl1neSJCQcPFK0glfvYi8zV8hUs2a7Gfsn_40wKv_a01oHdIPXxOspQwvFQDpvQyCdkfb-hL6zuwtm_bgVzMdIonmP4zetXz8iVdtbo-cW_-wMMG9XOhBixNkTCyoGPrJmY62LEDEQLTU2DkhVZH6E0eF-4pH5M","q":"uDcuZR5xXy2wF1MMANT0Hlyj1rn8lAdfDoAadPmapQv2a_ULQHBmMJDpzbXQISKkMHMfzG4w1q2rFTWczPb35ik3kF6-zPSf38yyY3pLbQwU9ULx5WoR7dtsPcKk1E0L4f1VN1yRl-IoshoXcIfFqRcTMjTbs3fH-_qBGOyLyxE","dp":"CIAO7f_SKPU3gUcRrluIuAULVsXmE0O0r4DRzD58rc5oDIgdI3WIKRyAznMs-sZvx31QEBe8Yzvt4M39x-LhOlpv8LKLYBKnwuNmln14WDjlEUfuWp_IpuYCy1ErTLSXvfTjS7z1OLHe6NDh-3uHLIz4sWhOmGIyw9Znf6oOcck","dq":"Dbm20DvzcIcD7sj2RP2Y7sYyQuZ6pkDiWT88OWj7l76LbsHEQ9ncE1RIx1X7muxs1VtOjDnNk8E-1Qa4lyDzmYeKp0wX5Ud4vgEPbZAIHKjgyuFhCpnbmiBWMUfWZicTcpQgjE5uXqWwKIz_IBhNpuqcOIptsDKFiQXCJqxBQjE","qi":"SqKnIR9Z7GNsT0xd0SXMi2SqDPImwVhrO4H1MoDwUq_ie1NQk-YCd-SaiMUqMfhX4QRGPDT3heNYu9upeaotm6psc8OTRqslRS4JnnQy5f5G1-NbsQ9u_POgTy2OCPGm7YFF2YhR2IiRS-2tKksXaECUx7ULJqH4OBaBrAo-ohE"}]}') // Client Secret

const grant_types = ["authorization_code", "refresh_token"];
const token_endpoint_auth_method = "private_key_jwt";

// let config = await client.discovery(
//   server,
//   clientId,
//   {
//     grant_types,
//     token_endpoint_auth_method,
//     client_secret: clientConfig.keys[0]
//   }
// )

const jwk = {
    kty: 'RSA',
    kid: 'Gu7GtAnW9KlV9EBCBvukekpQGCcBmulzPmeAvfznGUA',
    use: 'sig',
    alg: 'RS256',
    e: 'AQAB',
    n: 'hRdHm5-KCes746F_sHylRu3mhQbOYSX-A9Wj7416QOT1F8MIW1IjK-cJ4ER9E6OuZ8knpqLhwYdcgSqmDyogizzl1BmZScTkUaSoTi51F_jFNaQNz6BTXOhcmXTI7ApQM88BZJy01jmuN8bRgFxpzYlu-046E53r_7o9vSVXDYFpBV3BZfXFzQaSC33aVUuV9IpmCzeKx6_zNc-R56ralJ4ull4hbDl3ETsVPvAvdFcUdAMSYkWOYjV5bdBPIxW2X9POeB-lf-xvgcUataL-io38W9VKNgYZBY74PXM50VMSMP_ULmJ9EXxDL5Y0-ZngoTqCIZ0roTz92jupFZWpww',
    d: 'CxbL-Br8YOQxKr-3iGhySu0igl31TyHfvskLrjd_Aq4w_6hX52f6FzvaVk3OkBbYvrwDaj5zCfFx0y9PA79yU7egvKHfZEab8XODNHRpfDRVlikTn4OPvpN7t6uD3Crl0NNEHfJynNDUg8A0j3njtOTpEtZLP3wugDGv2DUmwjCx4YJnJeUy-UIxoGhGbEBfKkwX7ivUPcvDLfhJJh_4UcrRsT20IVh_xlss-e8d7tG4zoI3tlcFqskRyo89EFqKNh_uv0ClaXHyEYrii5yYqLTh8IJoelTGY0yBD392BmUZ5mApymRfvgT2sqC5oWiryaXFSo__yXmeAlm4KMu2EQ',
    p: 'uPQNbxCsF77Dsl1neSJCQcPFK0glfvYi8zV8hUs2a7Gfsn_40wKv_a01oHdIPXxOspQwvFQDpvQyCdkfb-hL6zuwtm_bgVzMdIonmP4zetXz8iVdtbo-cW_-wMMG9XOhBixNkTCyoGPrJmY62LEDEQLTU2DkhVZH6E0eF-4pH5M',
    q: 'uDcuZR5xXy2wF1MMANT0Hlyj1rn8lAdfDoAadPmapQv2a_ULQHBmMJDpzbXQISKkMHMfzG4w1q2rFTWczPb35ik3kF6-zPSf38yyY3pLbQwU9ULx5WoR7dtsPcKk1E0L4f1VN1yRl-IoshoXcIfFqRcTMjTbs3fH-_qBGOyLyxE',
    dp: 'CIAO7f_SKPU3gUcRrluIuAULVsXmE0O0r4DRzD58rc5oDIgdI3WIKRyAznMs-sZvx31QEBe8Yzvt4M39x-LhOlpv8LKLYBKnwuNmln14WDjlEUfuWp_IpuYCy1ErTLSXvfTjS7z1OLHe6NDh-3uHLIz4sWhOmGIyw9Znf6oOcck',
    dq: 'Dbm20DvzcIcD7sj2RP2Y7sYyQuZ6pkDiWT88OWj7l76LbsHEQ9ncE1RIx1X7muxs1VtOjDnNk8E-1Qa4lyDzmYeKp0wX5Ud4vgEPbZAIHKjgyuFhCpnbmiBWMUfWZicTcpQgjE5uXqWwKIz_IBhNpuqcOIptsDKFiQXCJqxBQjE',
    qi: 'SqKnIR9Z7GNsT0xd0SXMi2SqDPImwVhrO4H1MoDwUq_ie1NQk-YCd-SaiMUqMfhX4QRGPDT3heNYu9upeaotm6psc8OTRqslRS4JnnQy5f5G1-NbsQ9u_POgTy2OCPGm7YFF2YhR2IiRS-2tKksXaECUx7ULJqH4OBaBrAo-ohE'
}
const key = jose.importJWK(jwk)

let config = await client.discovery(
  new URL(providerUrl),
  clientId,
  {
    grant_types,
    token_endpoint_auth_method,
    // client_secret: OIDCClient.PrivateKeyJwt(crypto.createPrivateKey(jwks[0]))
  },
  OIDCClient.PrivateKeyJwt(key)
)

console.log({s: config.serverMetadata(), c: config.clientMetadata()})
