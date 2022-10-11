import { Animator, Collider, HumanBodyBones, SphereCollider, Transform ,Collision} from 'UnityEngine'
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {

    public animator: Animator;
    public rightHand: SphereCollider;

    private Awake() {
        this.animator = this.GetComponentInChildren<Animator>();
        this.rightHand = this.animator.GetBoneTransform(HumanBodyBones.RightHand).gameObject.AddComponent<SphereCollider>();
        this.isPunchStop();
    }
    
    //피격 받았을 때
    OnCollisionEnter(coll: Collision){
        console.log(coll.transform.name);
        if(coll.transform.name=="hand_R"){
            console.log("hand");
        }
    }
    public isPunchStart() {
        console.log("not use");
        this.rightHand.enabled = true;
    }
    public isPunchStop() {
        this.rightHand.enabled = false;
    }
}