import { Enum } from 'System'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export enum UpdateAuthority{
    "Server"=0,
    "Client"
}

export default class PlayChooseSample extends ZepetoScriptBehaviour {
    
    public format:UpdateAuthority;
    public aa:int;
    Start() {    
    }

}