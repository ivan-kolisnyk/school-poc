export default function () {
  return process.env.SITE_NOW ? new Date(process.env.SITE_NOW) : new Date();
}
