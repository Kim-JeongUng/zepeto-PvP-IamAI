import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CharacterController, Collider, Collision, ControllerColliderHit} from 'UnityEngine'

export default class CollTest extends ZepetoScriptBehaviour {
    
    //피격 받았을 때
    OnControllerColliderHit(hit: ControllerColliderHit){
        if(hit.transform.name=="hand_R"){
            console.log("hand");
        }
    }

}