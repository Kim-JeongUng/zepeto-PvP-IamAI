import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import {Transform,GameObject, WaitForSeconds} from 'UnityEngine';
import { Text } from 'UnityEngine.UI';



interface PlayerKillInfo {
    attackerSessionId: string,
    attackerNickname: string,
    victimSessionId: string,
    victimNickname: string,
}

export default class KillLogPanel extends ZepetoScriptBehaviour {
    @SerializeField() private _LogObjectPool: Transform;
    @SerializeField() private _destroyDelay: number = 10;
    private nowKillLogCount:number = 0;
    
    public GetKillLog(killInfo:PlayerKillInfo){

        if(this.nowKillLogCount == 0)
            this._LogObjectPool.gameObject.SetActive(true);
        
        this.StartCoroutine(this.SetKillLog(killInfo));
        this.nowKillLogCount++;
    }
        
    *SetKillLog(killInfo:PlayerKillInfo){
        let log = this._LogObjectPool.GetChild(0);
        log.SetAsLastSibling();
        log.gameObject.SetActive(true);
        log.GetComponentInChildren<Text>().text = killInfo.attackerNickname+" Killed "+killInfo.victimNickname;
        
        yield new WaitForSeconds(this._destroyDelay);
        log.gameObject.SetActive(false);
        this.nowKillLogCount--;
        if(this.nowKillLogCount == 0)
            this._LogObjectPool.gameObject.SetActive(false);
    }
}