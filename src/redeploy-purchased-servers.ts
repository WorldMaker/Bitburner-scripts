const app = 'base-hack.js'
const appRamCost = 2.4
let target: string = 'harakiri-sushi'

export async function main(ns: NS) {
	target = ns.args[0].toString() ?? target
	const servers = ns.getPurchasedServers()
	for (const server of servers) {
		const ram = ns.getServerMaxRam(server)
		ns.scp(app, server)
		ns.killall(server)
		ns.exec(app, server, Math.floor(ram / appRamCost), target)
	}
}
