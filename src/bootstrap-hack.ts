const app = 'base-hack.js'
const appRamCost = 2.4
const maxDepth = 2
let target: string = 'n00dles'

async function hackServer(ns: NS, server: string) {
	const hackingLevel = ns.getHackingLevel()
	const serverLevel = ns.getServerRequiredHackingLevel(server)
	if (serverLevel < hackingLevel) {
		// hack
		const ports = ns.getServerNumPortsRequired(server)
		switch (ports) {
			case 1:
				if (!ns.fileExists('BruteSSH.exe', 'home')) {
					return
				}
				ns.brutessh(server)
			// continue to case 0
			case 0:
				ns.nuke(server)
				break
			default:
				ns.print(`WARN ${server} needs ${ports} ports`)
				return
		}
		// deliver payload
		const ram = ns.getServerMaxRam(server)
		ns.scp(app, server)
		ns.killall(server)
		ns.exec(app, server, Math.floor(ram / appRamCost), target)
	}
}

async function scanServers(ns: NS, server = 'home', depth = 0) {
	const servers = ns.scan(server)
	for (const server of servers) {
		hackServer(ns, server)
		if (depth < maxDepth) {
			scanServers(ns, server, depth + 1)
		}
	}
}

export async function main(ns: NS) {
	target = ns.args[0].toString() ?? target
	scanServers(ns)
}
