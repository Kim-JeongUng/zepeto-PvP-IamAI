import { Animator, Collider, HumanBodyBones, SphereCollider, Transform } from 'UnityEngine'
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
        console.log("SADA");
        this.rightHand.enabled = true;
    }
    public isPunchStop() {
        this.rightHand.enabled = false;
    }
}