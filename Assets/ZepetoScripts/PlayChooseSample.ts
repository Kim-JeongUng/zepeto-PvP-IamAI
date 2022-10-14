import { Enum } from 'System'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

enum UpdataAuthority{
    "Server"=0,
    "Client"
}

export default class PlayChooseSample extends ZepetoScriptBehaviour {
    
    public Upd:UpdataAuthority;
    public aa:int;
    Start() {    
        
    }

}