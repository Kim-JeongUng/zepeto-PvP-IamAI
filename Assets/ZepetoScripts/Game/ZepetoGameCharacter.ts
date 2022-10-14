import { Animator, Collider, HumanBodyBones, SphereCollider, Transform ,Collision, ControllerColliderHit, CharacterController} from 'UnityEngine'
import { ZepetoCharacter } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class ZepetoGameCharacter extends ZepetoScriptBehaviour {

    public animator: Animator;
    public rightHand: SphereCollider;

    private Awake() {
        this.animator = this.GetComponentInChildren<Animator>();
        this.rightHand = this.animator.GetBoneTransform(HumanBodyBones.RightHand).gameObject.AddComponent<SphereCollider>();
        this.isPunchStop();
    }
    public isPunchStart() {
        console.log("not use");
        this.rightHand.enabled = true;
    }
    public isPunchStop() {
        this.rightHand.enabled = false;
    }
}