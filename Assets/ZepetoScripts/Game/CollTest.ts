import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Collision} from 'UnityEngine'

export default class CollTest extends ZepetoScriptBehaviour {

    Start() {    
        console.log("HI")
    }
    
    //피격 받았을 때
    OnCollisionEnter(coll: Collision){
        
        if(coll.transform.name=="hand_R"){
            console.log("hand");
        }
    }

}