import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

interface PlayerKillInfo {
    attackerSessionId: string,
    victimSessionId: string,
}
export default class KillLogPanel extends ZepetoScriptBehaviour {
    
    Start() {    

    }
    public AddKillLog(killInfo:PlayerKillInfo){
        console.log("ASD");
    }
}