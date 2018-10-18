import expect from 'expect.js'
import jscc from './jscc'

describe('Async Operation', function () {

  it('must be enabled if a callback is received.', function (done) {
    const source = '$_VERSION'

    jscc(source, '', null, (err, result) => {
      if (!err) {
        expect(result).to.be.an('object')
        expect(result).to.ok()
        expect(result!.code).not.to.be(source)
      }
      done(err)
    })
  })

  it('must return an error instead throw exceptions.', function (done) {
    jscc('//#if', '', null, (err, _) => {
      expect(err).to.be.a(Error)
      expect(err!.message).to.contain('Expression expected')
      done()
    })
  })

  it('data object must be undefined when an error is generated.', function (done) {
    jscc('//#if', '', null, (err, result) => {
      expect(err).to.be.a(Error)
      expect(result).to.be(undefined)
      done()
    })
  })


  it('jscc() must return undefined.', function (done) {
    const ret = jscc('$_VERSION', '', null, done)
    expect(ret).to.be(undefined)
  })

})
