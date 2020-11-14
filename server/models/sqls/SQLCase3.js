/*
 * Case3, to filter and count all stuff via trees table directly, it would be slow if the data set is huge
 */

class SQLCase1{

  constructor(){
    this.isFilteringByUserId = false;
    this.userId = undefined;
  }


  setClusterRadius(clusterRadius){
    this.clusterRadius = clusterRadius;
  }

  getClusterRadius(){
    parseFloat(this.clusterRadius)
    return this.clusterRadius;
  }

  addFilterByUserid(userid){
    this.userid = userid;
  }

  addFilterByWallet(wallet){
    this.wallet = wallet;
  }

  addFilterByFlavor(flavor){
    this.flavor = flavor;
  }

  addFilterByToken(token){
    this.token = token;
  }

  getFilter(){
    let result = "";
    if(this.userid){
      result += 'AND trees.planter_id = ' + this.userid + ' ';
    }
    if(this.wallet) {
      result += "AND entity.wallet = '" + this.wallet + "'"
    }
    return result;
  }

  getJoin(){
    let result = "";
    if(this.wallet){
      result += 'INNER JOIN token ON token.tree_id = trees.id \n';
      result += 'INNER JOIN entity ON entity.id = token.entity_id \n';
    }
    if(this.flavor){
      result += "INNER JOIN tree_attributes ON tree_attributes.tree_id = trees.id";
    }
    if(this.token){
      result += "INNER JOIN certificates ON trees.certificate_id = certificates.id AND certificates.token = '" + this.token + "'";
    }
    return result;
  }

  getJoinCriteria(){
    let result = "";
    if(this.flavor){
      result += "AND tree_attributes.key = 'app_flavor' AND tree_attributes.value = '" + this.flavor + "'";
    }
    return result;
  }

  setBounds(bounds){
    this.bounds = bounds;
  }

  getBoundingBoxQuery(){
    let result = "";
    if (this.bounds) {
      result += 'AND trees.estimated_geometric_location && ST_MakeEnvelope(' + this.bounds + ', 4326) ';
    }
    return result;
  }

  getQuery(){
    console.log('Calculating clusters directly');
    const query = {
      text: `
        /* case3 */
        SELECT 'cluster'                                           AS type,
        St_asgeojson(St_centroid(clustered_locations))                 centroid,
        St_numgeometries(clustered_locations)                          count
        FROM   (
        SELECT Unnest(St_clusterwithin(estimated_geometric_location, $1)) clustered_locations
        FROM   trees 
        ${this.getJoin()}
        WHERE  active = true 
        ${this.getBoundingBoxQuery()} 
        ${this.getFilter()} 
        ${this.getJoinCriteria()}  
        ) clusters`,
      values: [this.getClusterRadius()]
    };
    return query;
  }
}

module.exports = SQLCase1;
