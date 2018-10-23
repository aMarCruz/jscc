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

  it('must reject with an Error object instead throw an exception.', function (done) {
    jscc('//#if', '', null, (err) => {
      expect(err).to.be.a(Error)
      expect(err!.message).to.contain('Expression expected')
      done()
    })
  })

  it('the `#error` directive must reject with an Error object as well.', function (done) {
    jscc('//#error "ERROR"', '', null, (err) => {
      expect(err).to.be.a(Error)
      expect(err!.message).to.contain('ERROR')
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

  it('jscc() function in async mode must return undefined.', function (done) {
    const result = jscc('$_VERSION', '', null, (err) => {
      expect(err).to.be(null)
    })
    expect(result).to.be(undefined)
    done()
  })

})
